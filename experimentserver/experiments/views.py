from django.shortcuts import render,redirect,get_object_or_404
from .models import Experiment,Response
from django.http import HttpResponse

# Create your views here.
def front_view(request):
	exp_list = Experiment.objects.all()
	return render(request,'experiments/frontpage.html',{'exp_list' : exp_list})

def exp_view(request):
	exp = get_object_or_404(Experiment,pk=request.POST['Experiment'])
	context = {
		'expid' : exp.pk,
		'title' : exp.title,
		'question' : exp.question,
		'name' : request.POST['Name'],
		'roll' : request.POST['RollNo'],
		'age' : request.POST['Age'],
		'gender' : request.POST['Gender']
	}
	return render(request,'experiments/exp' + str(request.POST['Experiment']) + '.html',context)

def submit_view(request):
	exp = get_object_or_404(Experiment,pk=request.POST['expid'])
	exp.response_set.create(name = request.POST['Name'],roll = request.POST['RollNo'],gender = request.POST['Gender'],
		age = request.POST['Age'],happy = request.POST['happy'],sad = request.POST['sad'],fearful = request.POST['fearful'],
		angry = request.POST['angry'],surprised = request.POST['surprised'])
	return HttpResponse('Thanks for participating!')